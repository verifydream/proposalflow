import { expect, test, vi, describe, beforeEach } from 'vitest';
import { appRouter } from './trpc';

vi.mock('@/lib/db', () => ({
  getDashboard: vi.fn(),
  getProjects: vi.fn(),
  addProject: vi.fn(),
  addProposal: vi.fn(),
  getProposal: vi.fn(),
  updateProposalStatus: vi.fn(),
  deleteProposal: vi.fn(),
  getInvoicesByProject: vi.fn(),
  getProject: vi.fn(),
  addContract: vi.fn(),
}));

import * as db from '@/lib/db';

const createCaller = appRouter.createCaller;

describe('tRPC API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('projects', () => {
    test('create rejects float values for IDR currency', async () => {
      const caller = createCaller({ userId: 1 });

      await expect(
        caller.projects.create({ name: 'Test', value: 1000.5 })
      ).rejects.toThrow();

      db.addProject.mockResolvedValue({ id: 1, name: 'Test', value: 1000 });
      const result = await caller.projects.create({ name: 'Test', value: 1000 });
      expect(result).toEqual({ id: 1, name: 'Test', value: 1000 });
    });
  });

  describe('proposals', () => {
    test('updateStatus allows valid transitions', async () => {
      const caller = createCaller({ userId: 1 });

      db.getProposal.mockResolvedValue({ id: 1, status: 'draft' });
      db.updateProposalStatus.mockResolvedValue({ id: 1, status: 'sent' });

      const result = await caller.proposals.updateStatus({ id: 1, status: 'sent' });
      expect(result).toEqual({ id: 1, status: 'sent' });
    });

    test('updateStatus rejects invalid transitions', async () => {
      const caller = createCaller({ userId: 1 });

      db.getProposal.mockResolvedValue({ id: 1, status: 'draft' });

      await expect(
        caller.proposals.updateStatus({ id: 1, status: 'approved' })
      ).rejects.toThrow('Invalid status transition from draft to approved');
    });

    test('delete prevents deletion if active invoice exists', async () => {
      const caller = createCaller({ userId: 1 });

      db.getProposal.mockResolvedValue({ id: 1, project_id: 100 });
      db.getInvoicesByProject.mockResolvedValue([{ id: 1, status: 'draft' }]);

      await expect(
        caller.proposals.delete({ id: 1 })
      ).rejects.toThrow('Cannot delete proposal because an active invoice exists for this project');
    });

    test('delete allows deletion if no active invoice exists', async () => {
      const caller = createCaller({ userId: 1 });

      db.getProposal.mockResolvedValue({ id: 1, project_id: 100 });
      db.getInvoicesByProject.mockResolvedValue([]);
      db.deleteProposal.mockResolvedValue({ id: 1 });

      const result = await caller.proposals.delete({ id: 1 });
      expect(result).toBe(true);
      expect(db.deleteProposal).toHaveBeenCalledWith(1);
    });
  });

  describe('dashboard', () => {
    test('dashboard returns expected stats shape', async () => {
      const caller = createCaller({ userId: 1 });

      const mockStats = {
        totalProjects: 10,
        activeProjects: 8,
        totalRevenue: 5000000,
        pendingPayments: 2000000,
        recentProjects: [],
        recentInvoices: []
      };

      db.getDashboard.mockResolvedValue(mockStats);

      const result = await caller.dashboard();
      expect(result).toEqual(mockStats);
    });
  });
});
