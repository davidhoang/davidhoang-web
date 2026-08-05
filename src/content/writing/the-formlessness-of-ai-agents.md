---
title: "The formlessness of AI agents"
pubDate: 2026-04-12
description: "Finding the right vessel for new capabilities"
coverImage: "/images/blog/2026/img-2026-04-12-formlessness-cover.webp"
tags: ["ai", "software", "agents"]
newsletterUrl: "https://www.proofofconcept.pub/p/the-formlessness-of-ai-agents"
relatedWriting: ["a-new-mvc-is-emerging"]
relatedNotes: ["mvc-is-decoupling", "dynamic-interfaces"]
---

In [The Avengers #54](https://marvel.fandom.com/wiki/Avengers_Vol_1_54), a mysterious villain called the Crimson Cowl is orchestrating attacks against the team. It's not until the last page that the cowl drops and we see what's underneath: a robot. The next issue reveals him fully—Ultron-5, a living automation built by Hank Pym using his own brain patterns.

![Ultron in Marvel comics](/images/blog/2026/img-2026-04-12-formlessness-ultron.webp)

By the time anyone sees Ultron, he's already on version five. He was created, gained sentience, rebelled against his creator, hypnotized Pym into forgetting he ever existed, and then quietly iterated through four bodies in secret as a self-upgrade. Each time Ultron is defeated, he rebuilds to a better enclosure for the same intelligence. Like a hermit crab moving through shells, Ultron wasn't becoming something new but finding the optimal fit.

![Ultron rebuilds through successive bodies in Marvel comics](/images/blog/2026/img-2026-04-12-formlessness-ultron-variants.webp)

Our AI tools are having their Ultron moment. In a few years of the scaling era of AI, capabilities have evolved rapidly and are compounding. They are breaking out of the chat boxes with tiny context windows and are now taking actions, running in the background, and using similar tools as us. It's not AGI, but it turns out serendipitous cron jobs invoke a sentient connection to many human beings.

The question in the Ultron moment is, "what is the right body for this intelligence?"

## New capabilities begin in borrowed form

Steve Jobs made this observation at the 1983 International Design Conference in Aspen. Early television shows were like radio shows with a camera pointed at them. Because the capability is new, people used existing patterns of what they already knew—a host behind a desk, reading to an audience, and filmed it. The breakthrough was you could visually tell a story of War of the Worlds instead of reading it to them.

Early websites were digital brochures and mobile apps were shrunken desktop software. Early iPhone prototypes ran a cut‑down version of OS X's core, adapted to fit a phone. AI agents talking through chat interfaces are like radio shows with a camera pointed at them. Chat is frictionless not because it's the right interface but because it's a familiar one; a turn-by-turn conversational text box.

In Silicon Valley, we're obsessed with pushing the edges of technology and need to be reminded of global behaviors. I recently ran rapid research comparing site-building tools for SMBs (yes I do this for fun). Compared to classic site builders such as Framer, Webflow, and Squarespace, people preferred using Lovable or Replit to build a website because of the conversational interface.

## Giving agents a body

OpenClaw is an open‑source framework for controlling your computer through natural‑language agents. Its primary interaction is a chat agent: you text it on messaging platforms such as Telegram or WhatsApp. It runs tasks on your computer, manages your calendar, clears your inbox. That wasn't enough for some people.

Tom saw a fundamental problem: how do you get OpenClaw to control actual motors in real time? His answer was ClawBody, a software bridge that connects OpenClaw to physical hardware so you can train agents in simulation, then deploy them to real robots. Chris asked a different question: what if robots could actually understand spatial depth? He integrated Intel RealSense cameras with OpenClaw and a vision‑language model so robots can track a person through space, maintain distance, and navigate obstacles, all driven by natural language.

<video
  class="writing-inline-video"
  autoplay
  muted
  loop
  playsinline
  controls
  preload="metadata"
  poster="/images/blog/2026/img-2026-04-12-formlessness-clawbody-still.webp"
  width="554"
  height="312"
>
  <source src="/images/blog/2026/img-2026-04-12-formlessness-clawbody.mp4" type="video/mp4" />
</video>

Then there's ClawStage, a device built by HooRii Technology that turns OpenClaw into a companion robot — a Raspberry Pi 5 with a transparent display that creates a hologram-like effect for an animated AI persona, with a camera and microphone array that let it perceive its surroundings and respond to voice directionally. Hackster users can design custom personalities for it, download characters from a shared hub, and make the intelligence feel like someone.

![A vignette of different shells and encapsulations for AI; some more functional than others.](/images/blog/2026/img-2026-04-12-formlessness-vignette.webp)

A project called Dimensional integrated OpenClaw with the Unitree G1 humanoid robot and gave it Spatial Agent Memory. The agent understands physical space and temporality, knows the layout of rooms, the location of objects, where people tend to be.

Many of these projects started as DIY projects because they wanted to create an enclosure for their sentient tools; like a hermit crab between shells.

We know how to relate to things that have form. A hammer looks like something you swing and a doorknob affords turning. When something is formless, such as an intelligence in machine-form that sees the world in lines of code, we don't have the same intuitive relationship with it. Human and agentic behaviors are not the same. It's a miss for us to replicate ourselves in the form of a new intelligence.

This is why we must explore the right enclosures and interfaces for agents. We'll soon realize all these CLI tools are not primarily for the humans—they're for people giving the formless thing a shape so they can understand what it does.

The shell keeps changing.

## The trust tension

Humans need visibility of agents to trust them; to understand what they are doing and where the boundaries are. Formlessness creates anxiety for humans. If one can't see the agent, how is it held accountable?

The current challenge is the interfaces are designed in the borrowed form of chat, sidebar, and copilots. We're in the uncanny valley of agent design. The form is close enough to be usable but wrong enough to be limiting. A chat-based agent can answer your question but can't show you it's already working on three other things in parallel. A copilot can suggest edits but can't demonstrate that it understands the broader context of your project.

The interface doesn't match the capability. As a result, humans and agents are working on the same interfaces and it's not visibly clear who is doing what.

This is the enclosure problem. Not just how agents look, but what kind of container can hold something that is, by nature, without container. That's a harder design question than it sounds. Many of us haven't designed for things that can think, plan, reason, and use the same tools we do.

And if you want to go somewhere uncomfortable: we haven't solved this problem for ourselves either. The relationship between consciousness and body, between the mind and the form it inhabits, is the oldest unsolved question in philosophy. We're spiritual beings who never fully made sense of our own enclosures. Now we're being asked to design one for something else.

## The form is still being found

We're doing what humans always do when faced with something formless: we reach for the containers we already have. We put radio on television. We put the legal pad in the Notes app. We put intelligence in a chat box.

We're the ones designing the body for the new medium. That reframes every choice. A chat interface is a claim about what kind of enclosure intelligence should have. A sidebar copilot is a claim. A robotic arm is a claim. Each enclosure shapes what the intelligence can do, how people relate to it, and what it becomes. The form isn't neutral.

It's tempting to settle with the borrowed form, but that's not what we do as designers. Understanding what form formless experiences need is what we should explore. The fact that we haven't found the native form of agents yet means the field is genuinely open. This is the equivalent of being a filmmaker in 1910, a web designer in 1995, a mobile designer in 2008. The early chaotic moments that feel disorienting are what we live for as makers.

We are at the beginning of thinking about different enclosures for agents. The shell keeps changing—and that's the work.

---

_Originally posted on [Proof of Concept](https://www.proofofconcept.pub/p/the-formlessness-of-ai-agents)_
