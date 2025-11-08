import OpenAI from "openai";

const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { messages, persona } = await request.json();

    const streamResponce = await openAi.chat.completions.create({
      model: "gpt-4.1-mini",
      stream: true,
      messages: [
        {
          role: "system",
          content: persona.systemPrompt,
        },
        ...messages.map((message) => ({
          role: message.sender === "user" ? "user" : "assistant",
          content: message.text,
        })),
      ],
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of streamResponce) {
          const content = chunk.choices[0]?.delta?.content || "";

          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-type": "text/event-strem",
        "cache-control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to process the request",
        details: error.messages,
      },
      { status: 500 }
    );
  }
}
