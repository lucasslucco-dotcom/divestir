// Catálogo e designs ativos para a prévia do molde, lidos quando a tela pede.
// Os dois ficam guardados no servidor (carregarCatalogo e carregarDesigns), então
// a resposta sai rápida; o connection() deixa a leitura para a hora do pedido, e não
// para a publicação do site.
import { connection } from 'next/server';
import { erro } from '@/lib/api';
import { carregarCatalogo } from '@/lib/catalogo';
import { carregarDesigns } from '@/lib/designs';

export async function GET() {
  await connection();
  try {
    const [catalogo, designs] = await Promise.all([carregarCatalogo(), carregarDesigns()]);
    return Response.json(
      { catalogo, designs },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600' } },
    );
  } catch (motivo) {
    console.error('montagem: não consegui ler o catálogo ou os designs', motivo);
    return erro('Não consegui carregar os designs agora.', 503);
  }
}
