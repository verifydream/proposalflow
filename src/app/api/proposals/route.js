import { NextResponse } from 'next/server';
import { addProposal, updateProposalStatus, getProject, addContract } from '@/lib/db';

export async function POST(req) {
  const { projectId, title, content } = await req.json();
  return NextResponse.json(await addProposal(projectId, { title, content }));
}

export async function PATCH(req) {
  const { id, status } = await req.json();
  const proposal = await updateProposalStatus(id, status);
  if (proposal && status === 'approved') {
    const project = await getProject(proposal.project_id);
    if (project) await addContract(proposal.project_id, proposal.id, { title: project.name, value: project.value });
  }
  return NextResponse.json(proposal);
}
