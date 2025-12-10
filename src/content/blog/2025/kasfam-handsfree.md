---
title: Kasfam Handsfree
pubDatetime: 2025-12-10
description: Turning KaspaUnchained Into a Community Megaphone
heroImage: /assets/img/2025/kasfam-handsfree/kasfam.jpg
tags: ["kaspa", "x", "twitter"]
featured: true
---

I'm not going to get into the history of the @kaspaunchained X page. For that you can go search it up yourself.

What i will talk about today is something i feel is sorely needed and frankly couldnt come at a better time.

[Kasfam Handsfree](https://github.com/someone235/kasfam-handsfree)

High level:

- It pulls in tweets (yes i still call it a tweet, fk ya) about Kaspa
- Uses GPT 5.1 to decide if a tweet is worth engaging with
- Generates a suggested quote-tweet
- Stores everything in a dashboard where humans can approve/ reject

Right now, the operators are just three of us: Ori, KaspaSilver, and me. We act as the last step in the pipeline: the system proposes quote tweets, we sanity-check them, then they go out via the KaspaUnchained X account.

IMO that "human in the loop" step is a temporary guardrail. Long term, i see this becoming:

automatic curation → automatic approve/deny → automatic posting

So the account behaves more like a neutral, public curation bot for Kaspa content than a soapbox for whoever happens to hold the keys that month.

I've been using the current version for a couple of weeks – triaging tweets, posting the good ones – and yesterday working on some things i think might improve the overall experience and get us closer to to the full automation.

So, shipped the following PR's:

1. X API Integration
2. Gold Examples (Few-Shot Learning)
3. Percentile Scoring + Conversation Memory
4. UI Polish

## 1. X API Integration

This is pretty self explanatory so won't dig much into it but i'll mention that the current incarnation of this pulls from kaspa.news (thanks for making the API Vyte!) but also long term it's important that we have full integration of the x client into the platform for when we eventually want to start making posts also.

## 2. Gold Examples (Few-Shot Learning)

This is where things actually get a bit more interesting and will hopefully provide more longterm benefit:

"What's a good tweet to engage with?" is surprisingly fuzzy.

Different people will answer that differently, but the model needs some definition to latch onto.

This PR adds a way to mark stored tweets as GOOD or BAD examples. Those labels then get injected into the prompt as few-shot examples for GPT.

Key details:

- **GOOD** examples tell the model: this is the kind of thing we like to boost
- **BAD** examples force you to add a correction explaining why it's bad

That correction field matters. A "bad" tweet could be:

- Too low-effort
- Straight-up wrong on the facts
- Overly aggressive or tribal
- Fine content, but not suitable for the Unchained account tone

Writing that down gives the model a much sharper signal than just "nope".

## 3. Percentile Scoring + Conversation Memory

Originally the model scored tweets on a 1–10 scale.

That sounds clean, but i think we can do better. A "7" one day and a "7" the next day might not mean the same thing, because the batches are different and there's no shared state.

This PR does two things:

1. Switches from 1–10 to a 0–100 percentile-style score
2. Adds persistent GPT conversation memory so scores are calibrated across sessions

The memory part is the interesting bit.

Instead of starting a fresh GPT conversation every time, the system keeps a chain of previous evaluations alive. That gives the model a history of:

- Which tweets were scored high vs low
- Which ones humans later approved or rejected
- The gold examples you've marked along the way

Over time, that gives you a more stable sense of:

- **80+** = almost always worth posting
- **60–79** = depends on context and variety
- **<60** = probably skip unless there's something unique about it

Without that shared memory, the same tweet could end up as a "6" in one batch and a "9" in another with no obvious reason. With it, the system has a reference frame.

## 4. UI Polish

This was just a couple of minor quality of life tweaks but nothing major so not really worth mentioning.

---

Anyway, as i said earlier, this is very much a work in progress but i think it's a well needed step in the right direction.