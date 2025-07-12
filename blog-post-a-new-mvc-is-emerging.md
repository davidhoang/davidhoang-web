---
title: "A new MVC is emerging"
subtitle: "Issue 250: AI is breaking the way we build (and it's exciting)"
author: "David Hoang"
date: "2025-06-15"
source: "https://www.proofofconcept.pub/p/a-new-mvc-is-emerging"
tags: ["AI", "MVC", "Software Architecture", "Web Development", "Technology"]
---

# A new MVC is emerging

### Issue 250: AI is breaking the way we build (and it's exciting)

*Originally published by David Hoang on June 15, 2025*

For makers of software, Model/View/Controller (MVC) is one of the first concepts you learn. MVC is a design pattern that separates an application into three parts to organize code and make it easier to maintain. The Model handles data and business logic, the View manages the user interface, and the Controller acts as a middleman that processes user input and coordinates between them.

Think of it like a restaurant: the kitchen (Model) prepares the food, the dining room (View) is where customers eat, and the waiter (Controller) takes orders and communicates between the two. This separation allows developers to modify one part without breaking the others.

MVC has guided software architecture for decades—but AI is about to turn it on its head.

Instead of rigid relationships between data, interface, and logic, we're entering a world where intelligent agents dynamically orchestrate distributed systems. Rather than building monolithic apps with centralized databases, we now design decoupled systems where agents respond in real-time using protocols like MCP (Model Context Protocol).

So what happens when Model, View, and Controller all become intelligent?

Before I share my thoughts, I must acknowledge and share Ruben Verborgh's, Paradigm shifts for the decentralized Web. Verborgh, a professor of Decentralized Web Technology, wrote this back in 2017 laid out three critical shifts:

1. **End users become data controllers:** Users store their data where they want, improving privacy and control.
2. **Apps become views:** Apps are no longer single gateways, but interchangeable UI layers over personal data stores.
3. **Interfaces become queries:** Distributed data demands declarative, query-driven interfaces, not custom APIs.

Now, with AI in the loop, these shifts feel even more pressing—and they're converging with a reimagining of MVC. Let's explore what the new MVC looks like.

## The emerging MVC

The emerging MVC forces software makers think of system-centric product experiences instead of app-centric. Simply put, the containers are breaking and walled gardens are coming down. Let's look at the new constructs of MVC.

### LLMs as Models

During a conversation with Kyle Turman at Anthropic, they said something that stuck with me: "LLMs are grown, not built." That framing changed everything. Unlike traditional models you code and optimize, LLMs are trained, shaped, and continuously refined by their inputs and interactions. They behave less like deterministic engines and more like probabilistic ecosystems. This organic quality changes how we interface with them—and what we expect from "the model."

### Apps as Views

In this new world, the app is no longer the destination—it's the interface. Core workflows may still rely on apps, but increasingly, they're just _views_ for interacting with data and agents.

One of the first apps I ever built was Carogram, an Instagram client for the web and iPad using Node.js. Even back then, the trend was clear: apps were wrappers over data that lived elsewhere. Deep linking was a start. Now, we're looking at a future where apps might not store any data at all—just render it, query it, or pass it through.

That was the promise of the decentralized web and blockchain: portability, ownership, and independence from centralized services. It didn't fully land back then. But with AI and protocols like MCP, it may finally find footing.

### Agents as Controllers

This is where it gets interesting. If LLMs are the new Models and apps are our Views, AI agents step into the Controller role—except they don't just relay input anymore. They interpret, decide, act, and coordinate across distributed systems. With Model Context Protocols (MCP), agents dynamically handle context switching, planning, and executing across multiple apps and data sources.

They're not just smarter waiters. They're like sous-chefs, sommeliers, and maître d's rolled into one—making judgment calls in real time.

## Recap

I won't force a new acronym like **LAA** (LLMs, Apps, Agents)—but the point is clear: MVC isn't gone, it's evolving.

In this emerging architecture:

* Instead of maintaining a codebase, we're managing endpoints, protocols, and interactions
* Vendor lock-in becomes a liability, not a moat
* Apps need to be interoperable by design, not by exception
* AI interfaces act as meta-layers, sitting above and across traditional apps

Software isn't collapsing—it's decoupling. We are moving from app-centric experiences to system-centric ones. And with that comes a chance to rethink how we make, control, and interact with the systems around us.

---

## Hyperlinks + notes

A collection of references for this post, updates, and weekly reads.

* Rovo Dev agent, now available in the CLI → Congrats, team!
* Congrats to The Browser Company on launching Dia (huge shoutout to Tara Feener)
* Post-Chat UI by Allen Pike
* Australia has the best Synthwave music
* The Cat Distribution System at work
* The last six months in LLMs, illustrated by pelicans on bicycles by Simon Willison

---

*This blog post was originally published by David Hoang on [Proof of Concept](https://www.proofofconcept.pub/p/a-new-mvc-is-emerging) on June 15, 2025.*