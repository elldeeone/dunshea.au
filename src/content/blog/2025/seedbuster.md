---
title: Watching the Cert Stream
pubDatetime: 2025-12-09
description: Certificate logs, heuristics and a first pass at Kaspa wallet phishing detection.
heroImage: /assets/img/2025/seedbuster/wallet.jpg
tags: ["kaspa", "security", "phishing"]
featured: true
---

Okay, so yesterday I finally started on something that's been rattling around in my head for a while. 

I’ve noticed that after dinner, sitting on the couch, is when I end up “vibe coding” the most. I know vibe coding has picked up a bit of a bad connotation, but for me it’s just taking a random idea, running with it, and having some fun along the way. IMO Claude Code is still provides the most fun in that regard, just because of the way it bounces ideas back at you. Anyway.

## The problem

This idea comes from something that has always annoyed me: scammers. Every crypto community has them, but in the Kaspa community there are operators who spin up fake "Kaspa wallet" websites (not exclusive to Kaspa tho), and they're all over Google etc.

I’ve lost count of how many times I’ve gone down the rabbit hole trying to track down one of these wallet pages. Someone shares a link on X, or sends it to me directly, and suddenly I’ve burned an hour. It doesn’t really feel like a waste, because if it saves someone then it’s worth it, but I definitely spend at least an hour digging through who’s hosting it, who the domain registrar is, what API backends they’re using, and then reporting them all.

Right now, most providers actually respond pretty quickly. Every provider on the internet: registrars, hosting companies, whatever, has an abuse email address or some sort of form, and they generally take it seriously. So I’ll find the site, submit the form, and then refresh every so often over the next 24 hours to see if it goes offline. I’ve done this over and over. I get into it for a while, then life takes over and I move on to other things, but it stays in the back of my mind.

Because I know that someone: maybe my parents, maybe someone their age, will go to Google, type "Kaspa wallet", click the wrong result, and end up getting their account drained. That sits with me. So I've been thinking how can we push back without me dedicating hours of my time manually every time? There's no silver bullet, but I do think there's something we can do to make life at least a little more annoying for these idiots.

## Certificate transparency

The idea starts with a small piece of internet plumbing. Most sites you visit use HTTPS and present a TLS/SSL certificate. You can think of that certificate as a basic stamp of approval: a certificate authority (CA) has checked just enough to say “this domain controls this key”.

The interesting part is that certificate issuance is logged publicly through Certificate Transparency logs. I’m simplifying, but the short version is: whenever someone gets a certificate for some-domain.com, that record ends up in a set of public logs. That includes attackers. If you want your phishing site to show the little padlock, you need a cert, and that cert will leak your domain name.

Domain registrations themselves don’t give you any easy, real-time feed. But certificates do. Using existing open source tools, you can subscribe to a stream of new and renewed certificates and watch domains as they appear.

That gives you, in practice, a near real‑time stream of new domains. My idea: hook into that stream and filter it for interesting keywords. Anything related to Kaspa, “wallet”, “kas”, the usual patterns attackers use in their domain names.

Those candidate domains become telemetry. For each one, you hit the site and run it through a bunch of heuristics to decide if it’s malicious and what kind of scam it’s running.

Simple example: a seed phrase form that POSTs your 12‑word phrase to some random API endpoint is a dead giveaway. That exact pattern shows up constantly.

Some of the more sophisticated sites play games with you. If you visit a few times, they'll change the UI or even switch from a fake wallet to a generic Kaspa "educational" page to avoid being flagged. Real wallet sites don't usually behave like that, so that kind of behaviour becomes another signal in the classifier.

## The pipeline

This idea isn't new to me. I’ve circled it a few times but never really committed. I’ve hacked on tiny poc’s, nothing more. I still think it’s viable though, and certificate streams would just be one telemetry source. You could add others later, including manual submissions.

The pipeline in my head is: discovery → analysis → report.

The reporting part is where this becomes useful. Instead of me burning an hour every time I stumble on a scam, the system could do most of it automatically.

Once a site is flagged as malicious, it can look up the registrar and hosting provider, bundle up the evidence (screenshots, suspicious endpoints, whatever it found), and email their abuse contacts. At the same time it can submit to the usual phishing reporting channels, Google's form and the rest. That closes the loop: a 24/7 bot quietly watching, classifying, and filing reports.

So that's the idea at least.

## The session

Last night I finally started playing with it properly, mostly just having fun with Claude. This was my first real session with Opus 4.5 where I just sat down and let it run with the project.

It’s pretty fascinating seeing how far it’s come. I’ve used every Claude Code model at this point, even had a Max 20x subscription for a while before cancelling when (in my opinion) they quantised the old models into the ground. Opus 4.5 feels like a solid contender again. For serious back‑end work I still reach for Codex-5.1-Max-Heavy-Super-Duty-Double-Whatever‑They‑Call‑It, but Opus is a great model to play with and just explore ideas.

This post is mostly a brain dump, but I'd like the project to be useful to other people too. I'm not planning to keep it private. I did briefly think about hiding the methods so scammers couldn't adapt to them, but I think the net win from more people running and improving this kind of tool is higher. More eyes on phishing domains is a good thing, and it could easily grow beyond just the Kaspa community (maybe wishful thinking).

## Current status

Right now I've got it to the point where it:

- Monitors certificate streams
- Grabs candidate domains
- Fetches the site and runs the heuristics
- Passes everything into modules that decide how and where to report

It's very early and very rough, but it works enough to play with. Work in progress.

If you want to follow along, here's the GitHub repo: [seedbuster](https://github.com/elldeeone/seedbuster)

Fork it, get involved, or just steal ideas and do it better. This is just a bit of fun that might, with a bit of luck, add some real value one day.