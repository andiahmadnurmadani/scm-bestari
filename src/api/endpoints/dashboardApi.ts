import axiosClient from '../axiosClient';
import { mockDashboardMetrics, mockProductionChartData, mockDonutData, mockRecentActivities } from '../../mockData/dashboardData';

export const dashboardApi = {
  getSummaryStats: async () => {
    try {
      const response = await axiosClient.get('/dashboard/summary');
      return response.data;
    } catch {
      return mockDashboardMetrics;
    }
  },

  getChartData: async () => {
    try {
      const response = await axiosClient.get('/dashboard/charts');
      return response.data;
    } catch {
      return {
        productionTrend: mockProductionChartData,
        outputDonut: mockDonutData,
      };
    }
  },

  getRecentActivities: async () => {
    try {
      const response = await axiosClient.get('/dashboard/activities');
      return response.data;
    } catch {
      return mockRecentActivities;
    }
  },
};
