---
layout: post
title: "What's cooking in the Matlab?"
tagline: "Analysing the sound analysis"
category: algorithm
tags: [algorithm, matlab, HPS]
---
{% include JB/setup %}

![HPS algorithm in matlab]({{ HOME_PATH }}/assets/images/hps.png)

[Issue #9](https://github.com/biggestT/toney/issues/9) - Speech Detection
--------------------

Thanks to my friend Gustav Mårtensson I have a simple yet efficient way to detect speech samples among noise. It simply consists in checking the variance of the spectrogram for each sample and see if it passes above a threshold value. In the plot above we can see that this method nicely extracts the four speech sample in the recorded audio sample. Still this method currently is dependent on a static threshold value. I currently have these options that I could try to implement in order to get a smarter speech detection:

- Dynamic spectrogram variance threshold
- Make use of the [Web Speech API](https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html):s built in voice activity detection.
- Introduce a [simple noise gate](http://en.wikipedia.org/wiki/Noise_gate).

[Issue #13](https://github.com/biggestT/toney/issues/13) - HPS-Algorithm
-------------------------------------------------------------------------------------------
The HPS-algorithm also somewhat captures the characteristics of the four tones. Still the plot is noisy and the irregular data points needs to be taken care of. Because when the [LMS](http://biggestt.github.io/toney/algorithm/2013/07/11/simple-linear-regression/) are applied they will have a unproportiyonal effect on the straight line since it is approximated to minimize the squared error among the data points. It should also be noted that some points are of exactly the same value. This is due to the HPS-algorithm's nature, as summarized below:

> Another severe shortfall of the HPS method is that it its resolution is only
> as good as the length of the FFT used to calculate the spectrum.
> / [Gareth Middleton](http://cnx.org/content/m11714/latest/)

Toney currently uses the Web Audio API:s maximum FFT-resolution of 2048 to get as high a HPS-resolution as possible. Still this FFT is performed over the whole frequency spectrum ranging from 0 Hz up to half of the samplerate i.e 48 000 Hz / 2 = 24  000 Hz. This is an unnecessarily big interval since human speech only operates within 300 and 3400 Hz. Toney uses a bandpass filter to clip the spectrogram but is still currently unable to limit the frequency range coming into the Web Audio Analyser node. If Toney would be able to set the samplerate of the Audiocontext it would be good for performance as well as the resolution of the HPS. This is currently not possible but is posted as an [issue](https://code.google.com/p/chromium/issues/detail?id=73062) in the Chromium project. I currently consider to perform the FFT with a separate JavaScript library in order to get the control I need to only get the frequencies relevant for speech into the HPS. 

