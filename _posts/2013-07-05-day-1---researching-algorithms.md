---
layout: post
title: "Day 1 - Researching Algorithms"
description: "How do I detect the pitch?"
category: Days
tags: [algorithm, HPS]
---
{% include JB/setup %}

Toney has previously been using a pitch detection algorithm similiar to the one used by [phenomnomnominal](http://phenomnomnominal.github.io/docs/tuner.html). But the pitch detection was not functioning properly and I have therefore been looking into other algorithms to implement. There are reports out there about people using more complex procedures to detect pitch in Chinese speech. One of these methods uses a gammatone filterbank, an autocorrelation function and some neural networks to extract the lexical tone of a speech sample. I am afraid that a method like this will be too computationally expensive and also hard for me to implement properly in JavaScript. 

The Harmonic Product Spectrum algorithm, HPS, is computationally inexpensive and fairly easy to implement. The experiment [Song Pong](https://github.com/forsythrosin/songpong) uses HPS and I intend to start off by implementing a similiar pitch detection for Toney.