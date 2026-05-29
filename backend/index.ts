import { tavily } from "@tavily/core";
import express from "express";
import OpenAI from "openai";
import "dotenv/config";

import { SYSTEM_PROMPT, PROMPT_TEMPLATE } from "./prompts";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();

app.use(express.json());

app.post("/webster_ask", async (req, res) => {
  // get the user's query
  const query = req.body.query;
  // check for access/credits

  // TODO: check if we have web search indexed for the query

  // web search to get the resources
  const webSearchResponse = await client.search(query, {
    searchDepth: "advanced",
  });
  const webSearchResult = webSearchResponse.results;

  // context engineering : prompt + web search responses

  const prompt = PROMPT_TEMPLATE.replace(
    "{{WEB_SEARCH_RESULTS}}",
    JSON.stringify(webSearchResult),
  ).replace("{{USER_QUERY}}", query);

  // hit the LLM

  const stream = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    stream: true,
  });
  res.header("Cache-Control", "no-cache");
  res.header("Content-Type", "text/event-stream");

  // also stream back the responses and follow ups (in parallel from another LLM call)
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    res.write(text);
  }

  // end stream
  res.write("\n<SOURCES>\n");
  // webSearchResult.forEach((result) => res.write(JSON.stringify(result)));
  res.write(
    JSON.stringify(
      webSearchResult.map((result) => ({
        url: result.url,
      })),
    ),
  );
  res.write("\n</SOURCES>\n");

  res.end();
});

app.listen(3000);
