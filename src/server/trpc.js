import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import * as db from '@/lib/db';

const t = initTRPC.create();
const router = t.router;

export const appRouter = router({
  dashboard: t.procedure.query(async ({ ctx }) => {
    return await db.getDashboard(ctx.userId);
  }),
  projects: router({
    list: t.procedure.query(async ({ ctx }) => {
      return await db.getProjects(ctx.userId);
    }),
    create: t.procedure.input(z.object({ name: z.string(), clientId: z.number().optional(), value: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        return await db.addProject(ctx.userId, input);
      }),
  }),
  proposals: router({
    create: t.procedure.input(z.object({ projectId: z.number(), title: z.string(), content: z.any().optional() }))
      .mutation(async ({ input }) => {
        return await db.addProposal(input.projectId, { title: input.title, content: input.content });
      }),
    updateStatus: t.procedure.input(z.object({ id: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        const proposal = await db.updateProposalStatus(input.id, input.status);
        if (proposal && input.status === 'approved') {
          const project = await db.getProject(proposal.project_id);
          if (project) await db.addContract(proposal.project_id, proposal.id, { title: project.name, value: project.value });
        }
        return proposal;
      }),
  }),
  contracts: router({
    updateStatus: t.procedure.input(z.object({ id: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        const contract = await db.updateContractStatus(input.id, input.status);
        if (contract && input.status === 'signed') {
          const project = await db.getProject(contract.project_id);
          if (project) {
            await db.createInvoice(contract.project_id, {
              invoiceNumber: 'INV-' + String(contract.project_id).padStart(4, '0'),
              items: [{ description: project.name, amount: project.value }],
              subtotal: project.value, tax: Math.round(project.value * 0.11),
              total: project.value + Math.round(project.value * 0.11),
              dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            });
          }
        }
        return contract;
      }),
  }),
  invoices: router({
    list: t.procedure.query(async ({ ctx }) => {
      return await db.getInvoices(ctx.userId);
    }),
  }),
});

export type AppRouter = typeof appRouter;
