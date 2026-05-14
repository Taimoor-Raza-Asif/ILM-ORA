import { careerAPI } from "../infrastructure/api/careerAPI";
import { mockCareers } from "../infrastructure/data/mockCareers";

/** CareerInsights expects PayScale-shaped rows; mockCareers uses a different schema. */
function mockCareersForInsights() {
  return mockCareers.map((m) => {
    const min = m.salary?.min ?? 0;
    const max = m.salary?.max ?? 0;
    const mid = Math.round((min + max) / 2);
    return {
      id: m.id,
      job_title: m.title,
      average_salary: `PKR ${mid.toLocaleString("en-PK")}`,
      median_salary: `PKR ${mid.toLocaleString("en-PK")}`,
      salary_period: "Annual",
      summary: m.description,
      url: "https://www.payscale.com/",
      gender: { Male: "50%", Female: "50%" },
      benefits: { Medical: "55%", Dental: "35%", Vision: "25%", None: "10%" },
      experience_levels: {
        Entry: "▲ 4%",
        Mid: "▲ 9%",
        Senior: "▲ 14%"
      }
    };
  });
}

export const careerService = {
  /**
   * Get all careers
   */
  async getAll() {
    try {
      const response = await careerAPI.getAll();
      return response.data;
    } catch (error) {
      console.error("Failed to fetch careers:", error);
      return { careers: mockCareersForInsights() };
    }
  },
  /**
   * Get career by ID
   */
  async getById(id) {
    try {
      const response = await careerAPI.getById(id);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch career:", error);
      return mockCareers.find(c => c.id === id) || null;
    }
  },
  /**
   * Search careers
   */
  async search(query) {
    try {
      const response = await careerAPI.search(query || '');
      return response.data.careers || [];
    } catch (error) {
      console.error("Failed to search careers:", error);
      return [];
    }
  },
  
  /**
   * Get salary statistics
   */
  async getStats() {
    try {
      const response = await careerAPI.getStats();
      return response.data.stats || null;
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      return null;
    }
  },
  /**
   * Get high-growth careers
   */
  async getHighGrowthCareers() {
    try {
      const all = await this.getAll();
      const list = Array.isArray(all) ? all : (all?.careers ?? []);
      return list.filter(c => c.growth > 15).sort((a, b) => b.growth - a.growth);
    } catch (error) {
      console.error("Failed to fetch high-growth careers:", error);
      return [];
    }
  },
  /**
   * Get careers by industry
   */
  async getByIndustry(industry) {
    try {
      const all = await this.getAll();
      const list = Array.isArray(all) ? all : (all?.careers ?? []);
      return list.filter(c => c.industry === industry);
    } catch (error) {
      console.error("Failed to fetch careers by industry:", error);
      return [];
    }
  }
};