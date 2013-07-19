---
layout: post
title: "What's cooking in the Matlab?"
description: ""
category: algorithm
tags: [algorithm, matlab, HPS]
---
{% include JB/setup %}

Thanks to my friend Gustav Mårtensson I have a simple yet efficient way to detect speech samples among noise. It simply consists in checking the variance of the spectrogram for each sample and see if it passes above a threshold value. In the plot below we can see that this method nicely extracts the four speech sample in the recorded audio sample. The HPS algorithm also somewhat captures the characteristics of the four tones. Still the plot is noisy and the irregular data points needs to be taken care of. Because when the [LMS](http://biggestt.github.io/toney/algorithm/2013/07/11/simple-linear-regression/) are applied they will have a unproportiyonal effect on the straight line since it is approximated to minimize the SQUARED error among the data points. It should also be noted that some points are of exactly the same value. This might have to do with the fact that the spectrogram outputted by the web audio API currently are represented by 8-bit sized numbers. I have tried, without success, to instead use their 32-bit representation but the API then outputs values that I can’t get my head around. See this [stackoverflow post](http://stackoverflow.com/questions/14169317/interpreting-web-audio-api-fft-results) for more about that matter. I am not sure if the current representation will be enough to provide correct straight tonelines but I will have to stick with it until I get help I guess. 

![HPS algorithm in matlab]({{ HOME_PATH }}/assets/images/hps.png)