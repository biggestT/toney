---
layout: post
title: "the Audio Graph"
tagline: "Internal Web Audio analysis or external DSP.js library?"
category: audio graph
tags: [audio graph, algorithm, dsp.js, spectrogram]
---
{% include JB/setup %}

![the Audio Graph]({{ BASE_PATH }}/assets/images/audioGraph.png)
The current audio graph drawn in a trying-to-be-intuitive kind of way.


Since I currently can't set the samplerate in the Web Audio API:s audiocontext I am left with a spectrogram that only uses about a fourth of the actual FFT-resolution. Therefore I am looking into using the approach taken by [Craig Spence](http://phenomnomnominal.github.com/docs/tuner.html). He uses an external [DSP.js](https://github.com/corbanbrook/dsp.js/) library to perform the time domain windowing as well as the FFT-analysis. This approach is intuitively less optimized performance-wise since the analyser of the web audio API is done by compiled C++ code whereas DSP.js is interpreted javascript. Still it seems to be working well to do the FFT with DSP.js in real time on my computer with a frame rate of roughly 60 FPS. My current audio graph can be seen below. I now have the option of setting my own window function and deciding what time domain data should go into the FFT. At this point though I haven't been able to figure out how to output a  spectrogram that only covers the frequency bands of human speech so that I can fully utilize it's resolution. I hereby admit that I need to rehearse some DSP theory before moving on!








