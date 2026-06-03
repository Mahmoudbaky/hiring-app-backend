import { and, count, desc, eq, gte, lt, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  jobRequests,
  applicants,
  jobAds,
  departments,
} from "../db/schema.js";

export const dashboardService = {
  async getStats() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [{ thisMonth }] = await db
      .select({ thisMonth: count() })
      .from(jobRequests)
      .where(gte(jobRequests.createdAt, startOfThisMonth));

    const [{ lastMonth }] = await db
      .select({ lastMonth: count() })
      .from(jobRequests)
      .where(
        and(
          gte(jobRequests.createdAt, startOfLastMonth),
          lt(jobRequests.createdAt, startOfThisMonth)
        )
      );

    const trend =
      Number(lastMonth) > 0
        ? Math.round(((Number(thisMonth) - Number(lastMonth)) / Number(lastMonth)) * 100)
        : null;

    const [{ underReview }] = await db
      .select({ underReview: count() })
      .from(jobRequests)
      .where(inArray(jobRequests.status, ["new", "review"]));

    const [{ interviews }] = await db
      .select({ interviews: count() })
      .from(jobRequests)
      .where(eq(jobRequests.status, "interview"));

    const [{ rejected }] = await db
      .select({ rejected: count() })
      .from(jobRequests)
      .where(eq(jobRequests.status, "rejected"));

    return {
      totalRequests: Number(thisMonth),
      totalRequestsTrend: trend,
      underReview: Number(underReview),
      scheduledInterviews: Number(interviews),
      rejected: Number(rejected),
    };
  },

  async getChartData(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows = await db
      .select({ status: jobRequests.status, createdAt: jobRequests.createdAt })
      .from(jobRequests)
      .where(gte(jobRequests.createdAt, since))
      .orderBy(jobRequests.createdAt);

    const grouped = new Map<string, { n: number; s: number; r: number }>();
    for (const row of rows) {
      const dateKey = row.createdAt.toISOString().slice(0, 10);
      if (!grouped.has(dateKey)) grouped.set(dateKey, { n: 0, s: 0, r: 0 });
      const entry = grouped.get(dateKey)!;
      if (row.status === "new" || row.status === "review") entry.n++;
      else if (row.status === "shortlisted" || row.status === "interview" || row.status === "hired") entry.s++;
      else if (row.status === "rejected") entry.r++;
    }

    return Array.from(grouped.entries()).map(([date, c]) => ({
      date,
      new: c.n,
      shortlisted: c.s,
      rejected: c.r,
    }));
  },

  async getTopDepartments(limit = 5) {
    const rows = await db
      .select({
        departmentId: jobRequests.departmentId,
        name: departments.name,
        count: count(),
      })
      .from(jobRequests)
      .leftJoin(departments, eq(jobRequests.departmentId, departments.id))
      .groupBy(jobRequests.departmentId, departments.name)
      .orderBy(desc(count()))
      .limit(limit);

    return rows
      .filter((r) => r.departmentId !== null)
      .map((r) => ({
        departmentId: r.departmentId,
        name: r.name ?? "غير محدد",
        count: Number(r.count),
      }));
  },

  async getRecentRequests(limit = 4) {
    const rows = await db
      .select({
        id: jobRequests.id,
        status: jobRequests.status,
        submissionType: jobRequests.submissionType,
        referenceNumber: jobRequests.referenceNumber,
        createdAt: jobRequests.createdAt,
        applicant: {
          id: applicants.id,
          name: applicants.name,
          email: applicants.email,
          phone: applicants.phone,
        },
        jobAd: {
          id: jobAds.id,
          adTitle: jobAds.adTitle,
        },
      })
      .from(jobRequests)
      .innerJoin(applicants, eq(jobRequests.applicantId, applicants.id))
      .leftJoin(jobAds, eq(jobRequests.jobAdId, jobAds.id))
      .orderBy(desc(jobRequests.createdAt))
      .limit(limit);

    return rows;
  },

  // ── Company-scoped methods ────────────────────────────────────────

  async getCompanyStats(companyId: string) {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [{ thisMonth }] = await db
      .select({ thisMonth: count() })
      .from(jobRequests)
      .where(
        and(
          eq(jobRequests.hiringCompanyId, companyId),
          gte(jobRequests.createdAt, startOfThisMonth)
        )
      );

    const [{ lastMonth }] = await db
      .select({ lastMonth: count() })
      .from(jobRequests)
      .where(
        and(
          eq(jobRequests.hiringCompanyId, companyId),
          gte(jobRequests.createdAt, startOfLastMonth),
          lt(jobRequests.createdAt, startOfThisMonth)
        )
      );

    const trend =
      Number(lastMonth) > 0
        ? Math.round(((Number(thisMonth) - Number(lastMonth)) / Number(lastMonth)) * 100)
        : null;

    const [{ underReview }] = await db
      .select({ underReview: count() })
      .from(jobRequests)
      .where(
        and(
          eq(jobRequests.hiringCompanyId, companyId),
          inArray(jobRequests.status, ["new", "review"])
        )
      );

    const [{ interviews }] = await db
      .select({ interviews: count() })
      .from(jobRequests)
      .where(
        and(
          eq(jobRequests.hiringCompanyId, companyId),
          eq(jobRequests.status, "interview")
        )
      );

    const [{ rejected }] = await db
      .select({ rejected: count() })
      .from(jobRequests)
      .where(
        and(
          eq(jobRequests.hiringCompanyId, companyId),
          eq(jobRequests.status, "rejected")
        )
      );

    return {
      totalRequests: Number(thisMonth),
      totalRequestsTrend: trend,
      underReview: Number(underReview),
      scheduledInterviews: Number(interviews),
      rejected: Number(rejected),
    };
  },

  async getCompanyChartData(days = 30, companyId: string) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows = await db
      .select({ status: jobRequests.status, createdAt: jobRequests.createdAt })
      .from(jobRequests)
      .where(
        and(
          eq(jobRequests.hiringCompanyId, companyId),
          gte(jobRequests.createdAt, since)
        )
      )
      .orderBy(jobRequests.createdAt);

    const grouped = new Map<string, { n: number; s: number; r: number }>();
    for (const row of rows) {
      const dateKey = row.createdAt.toISOString().slice(0, 10);
      if (!grouped.has(dateKey)) grouped.set(dateKey, { n: 0, s: 0, r: 0 });
      const entry = grouped.get(dateKey)!;
      if (row.status === "new" || row.status === "review") entry.n++;
      else if (row.status === "shortlisted" || row.status === "interview" || row.status === "hired") entry.s++;
      else if (row.status === "rejected") entry.r++;
    }

    return Array.from(grouped.entries()).map(([date, c]) => ({
      date,
      new: c.n,
      shortlisted: c.s,
      rejected: c.r,
    }));
  },

  async getCompanyTopDepartments(companyId: string, limit = 5) {
    const rows = await db
      .select({
        departmentId: jobRequests.departmentId,
        name: departments.name,
        count: count(),
      })
      .from(jobRequests)
      .leftJoin(departments, eq(jobRequests.departmentId, departments.id))
      .where(eq(jobRequests.hiringCompanyId, companyId))
      .groupBy(jobRequests.departmentId, departments.name)
      .orderBy(desc(count()))
      .limit(limit);

    return rows
      .filter((r) => r.departmentId !== null)
      .map((r) => ({
        departmentId: r.departmentId,
        name: r.name ?? "غير محدد",
        count: Number(r.count),
      }));
  },

  async getCompanyRecentRequests(companyId: string, limit = 4) {
    const rows = await db
      .select({
        id: jobRequests.id,
        status: jobRequests.status,
        submissionType: jobRequests.submissionType,
        referenceNumber: jobRequests.referenceNumber,
        createdAt: jobRequests.createdAt,
        applicant: {
          id: applicants.id,
          name: applicants.name,
          email: applicants.email,
          phone: applicants.phone,
        },
        jobAd: {
          id: jobAds.id,
          adTitle: jobAds.adTitle,
        },
      })
      .from(jobRequests)
      .innerJoin(applicants, eq(jobRequests.applicantId, applicants.id))
      .leftJoin(jobAds, eq(jobRequests.jobAdId, jobAds.id))
      .where(eq(jobRequests.hiringCompanyId, companyId))
      .orderBy(desc(jobRequests.createdAt))
      .limit(limit);

    return rows;
  },
};
