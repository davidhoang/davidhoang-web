---
name: "Carogram"
coverImage: "/images/work/carogram/img_portfolio_carogram_04.png"
year: 2012
summary: "One of the first apps I ever built—an Instagram client for the web and iPad using Node.js. An early exploration of building apps as wrappers over data that lived elsewhere."
---

Carogram was one of my first forays into building apps that consumed APIs rather than storing data locally. Built with Node.js, it was an Instagram client for web and iPad that demonstrated how apps could be lightweight wrappers over existing services.

![Carogram App Interface](/images/work/carogram/img_portfolio_carogram_04.png)

## The Experiment

At the time, Instagram was primarily a mobile app. Carogram explored what Instagram could look like on larger screens—taking advantage of the iPad's display and the web's flexibility. The app consumed Instagram's API to display photos, feeds, and user profiles.

![Carogram iPad Experience](/images/work/carogram/img_portfolio_carogram_05.png)

## Technical Approach

Built with Node.js, Carogram was an early example of what would become a common pattern: apps as interfaces over APIs. The app didn't store user data locally but instead fetched and rendered content from Instagram's service in real-time.

![Carogram Web Interface](/images/work/carogram/img_portfolio_carogram_06.png)

![Carogram Screenshot](/images/work/carogram/2012-09-07%2005.01.42.png)

![Carogram App Details](/images/work/carogram/2012-09-07%2005.03.12.png)

## Learning

Carogram taught me important lessons about API design, data flow, and building apps that are essentially views over remote data. This pattern has become central to how many modern apps work—especially as we move toward more distributed architectures.

The project also reinforced something I've written about: apps as wrappers over data that lives elsewhere. Even back then, the trend was clear that apps might not store any data at all—just render it, query it, or pass it through.

## Impact

While Carogram was a personal project, it represented early thinking about how apps could be built differently. The concepts explored in Carogram—deep linking, API consumption, and apps as views—have become foundational to modern app development.

