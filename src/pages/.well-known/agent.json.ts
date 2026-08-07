import type { APIRoute } from 'astro';
import {
  assertNoForbiddenEndpoints,
  buildAgentDiscoveryContract,
  CANONICAL_ORIGIN,
} from '../../data/agentDiscovery';

export const prerender = true;

const CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400';

export const GET: APIRoute = () => {
  const contract = buildAgentDiscoveryContract({ origin: CANONICAL_ORIGIN });
  assertNoForbiddenEndpoints(contract);

  return new Response(JSON.stringify(contract, null, 2) + '\n', {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': CACHE_CONTROL,
    },
  });
};
