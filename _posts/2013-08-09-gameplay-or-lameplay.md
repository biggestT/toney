---
layout: post
title: "Gameplay or lameplay?"
tagline: "Bringing limited starpower to Toney "
category: 
tags: [gamplay, cosmetics]
---
{% include JB/setup %}

![first Gameplay screenshot]({{ BASE_PATH }}/assets/images/gameplay.png)

Tone detection is taking a break
-------------------------------

Since I can't set a custom samplerate with the Web Audio API I can only get a very limited spectrogram of the frequencies I am interested in. While awaiting this feature I have decided to move on by introducing some gameplay to Toney instead. 

Still I made one last attempt to improve the spectrogram coming into the HPS-algorithm. I did so by adding a high-pass filter to the current spectrogram in order to enhance the contrasts and get clearer peaks. In the code snippet below you can see how I use a filter kernel that I convolve with the original spectrogram:
	
{% gist 6193852 spectrogramModel.js %}

This results in a somewhat better pitch estimation but the results are still not good enough to overcome the bottleneck of low spectrogram resolution. Currently the algorithm can still yield somewhat satisfying results if all the parameters involved (HPS-iterations, audio filter coefficients, variance threshold etc.) goes through some fine tuning. But it is not by far good enough to accurately tone detect live input and especially not with disyllabic words like 瑞典 (Ruìdiǎn - Sweden).

Fun and games
-------------

Toney now has a starpowered scoring system in which the player gets stars according to how well she or he matches the reference tone-line. Since the algorithm is admittedly lacking in accuracy I have created a rather lenient scoring system. It currently only takes into account the overall slope and length of the tone-line and doesn't weigh in the characteristics of the different segments that the line may consist of. 

So from now on I can enjoy the privilege of becoming frustrated with a game that I, myself, have created. Anyway, this is the code snippet to blame when Toney doesn't give you the correct score:

{% gist 6193852 gameModel.js %}

If you have getUserMedia enabled in Chrome (the developer version of Firefox just [recently](https://hacks.mozilla.org/2012/07/getusermedia-is-ready-to-roll/) shipped with this feature but only in an experimental version and I don't think Toney is working there atm) you can try the demo on this [site]({{ BASE_PATH }}{{ site.JB.devdemo_path }}). Now go get some 非常好 tone-lines!



