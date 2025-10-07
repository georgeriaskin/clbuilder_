export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resumeText, vacancyDescription, tone, language, length } = req.body;

  if (!resumeText || !vacancyDescription) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const openRouterApiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!openRouterApiKey) {
    console.error('OpenRouter API key missing or empty');
    return res.status(500).json({ error: 'OpenRouter API key not configured' });
  }

  // Debug logging to verify API key is being loaded
  console.log('API Key loaded:', openRouterApiKey ? 'YES' : 'NO');
  console.log('API Key length:', openRouterApiKey?.length);
  console.log('API Key starts with:', openRouterApiKey?.substring(0, 10));

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterApiKey}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates cover letters based on resume and job description.'
          },
          {
            role: 'user',
            content: `Generate a ${tone} cover letter in ${language} that is ${length} length based on the following resume and job description:\n\nResume: ${resumeText}\n\nJob Description: ${vacancyDescription}`
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: errorData.error?.message || 'OpenRouter API error',
        status: response.status
      });
    }

    const data = await response.json();
    const coverLetter = data.choices[0]?.message?.content;

    if (!coverLetter) {
      return res.status(500).json({ error: 'No cover letter generated' });
    }

    res.status(200).json({ coverLetter });
    
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}