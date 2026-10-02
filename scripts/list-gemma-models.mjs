import { BackboardClient } from 'backboard-sdk';

async function main() {
  const apiKey = process.env.BACKBOARD_API_KEY;

  if (apiKey) {
    console.log('Querying Backboard model catalog using configured BACKBOARD_API_KEY...\n');
    try {
      const client = new BackboardClient({ apiKey });
      const modelsResponse = await client.listModels({ limit: 100 });
      const gemmaModels = (modelsResponse.models || []).filter(
        (m) =>
          m.id?.toLowerCase().includes('gemma') ||
          m.name?.toLowerCase().includes('gemma')
      );

      if (gemmaModels.length > 0) {
        console.log(`Found ${gemmaModels.length} Gemma model(s) on Backboard:`);
        for (const m of gemmaModels) {
          console.log(`- ID: ${m.id} | Name: ${m.name} | Provider: ${m.provider}`);
        }
        return;
      }
      console.log('No specific Gemma model listed in primary page; showing fallback OpenRouter catalog...');
    } catch (err) {
      console.warn('Could not query Backboard directly:', err instanceof Error ? err.message : err);
    }
  } else {
    console.log('BACKBOARD_API_KEY not set. Querying public OpenRouter catalog for Google Gemma models...\n');
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    const data = await res.json();
    const gemmaList = (data.data || []).filter((m) => m.id.startsWith('google/gemma'));

    console.log('Available Google Gemma Models:');
    console.log('------------------------------------------------------------');
    for (const model of gemmaList) {
      console.log(
        `- ${model.id.padEnd(32)} | Context: ${String(model.context_length).padStart(7)} tokens | ${model.name}`
      );
    }
    console.log('------------------------------------------------------------');
    console.log('Recommended default: google/gemma-3-27b-it (131k context window)');
  } catch (err) {
    console.error('Failed to query public catalog:', err);
  }
}

main().catch(console.error);
