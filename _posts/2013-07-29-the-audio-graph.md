---
layout: post
title: "the Audio Graph"
tagline: "Today's question is whether I should use the Web Audio API or an external JavaScript DSP library to get the spectrogram. Currently I get a spectrogram that covers an unnecessarily wide frequency range."
category: audio graph
tags: [audio graph, algorithm, dsp.js, spectrogram]
---
{% include JB/setup %}

### The graphical audio graph

![the Audio Graph]({{ BASE_PATH }}/assets/images/audioGraph.png)
The current audio graph drawn in a trying-to-be-intuitive kind of way.

### Who should do the heavy lifting?

Since one currently can't set the samplerate in the Web Audio API:s audiocontext I am left with a spectrogram that only uses about one sixth of the actual FFT-resolution (The highest frequency is that of half the sample rate, 24 kHz, compared to the highest human speech frequency of about 4 kHz). Therefore I am considering to instead implementing something similiar to [Craig Spence's](http://phenomnomnominal.github.com/docs/tuner.html) method. He uses an external [DSP.js](https://github.com/corbanbrook/dsp.js/) library to perform the time domain windowing as well as the FFT-analysis. This approach is intuitively less optimized performance-wise since the analyser of the web audio API is done by compiled C++ code whereas DSP.js is interpreted javascript. Still it seems to be working well to do the FFT with DSP.js in real time on my computer with a frame rate of roughly 60 FPS. I now have the option of setting my own window function and deciding what time domain data should go into the FFT. At this point though I haven't been able to figure out how to output a  spectrogram that only covers the frequency bands of human speech so that I can fully utilize it's resolution. I hereby admit that I need to rehearse some DSP theory before moving on!

### Automated build system for the win

A basic [Grunt](http://gruntjs.com/) setup is now in place. This means that I can just type "grunt" in the shell, while in the toney directory, and get the following very pleasing output:

	Running "jshint:files" (jshint) task
	>> 4 files lint free.

	Running "env:prod" (env) task

	Running "clean:prod" (clean) task
	Cleaning build/js/toney.min.js...OK
	Cleaning build/css/...OK
	Cleaning dist/...OK

	Running "concat:dist" (concat) task
	File "dist/toney.js" created.

	Running "uglify:dist" (uglify) task
	File "build/js/toney.min.js" created.

	Running "cssmin:minify" (cssmin) task
	File build/css/toney.min.css created.

	Running "preprocess:prod" (preprocess) task

	Done, without errors.

I intend to further on adding some other tasks like for example unit testing and finally including the Grunt command in a git-commit-hook. Now I am only afraid that I will soon know the names of more web-development-tools and frameworks than actual people. 





