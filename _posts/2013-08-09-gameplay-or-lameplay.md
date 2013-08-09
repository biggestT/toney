---
layout: post
title: "Gameplay or lameplay?"
tagline: "Bringing limited starpower to Toney "
category: 
tags: [gamplay, cosmetics]
---
{% include JB/setup %}

Leaving the valley of audio analysis
-------------------------------------------

With the Web audio API of not being able to set a custom samplerate I can only get a very limited spectrogram of the frequencies I am interested in. While awaiting this feature I have hence decided to move on with adding some gameplay features to Toney instead. Still I made one last attempt to improve the spectrogram coming into the HPS-algorithm. I did so by adding a high-pass filter to the current spectrogram in order to enchance the contrasts and get clearer peaks. In the code snippet below it can be seen how I use a filter kernel that I convolve with the original spectrogram:
	
{% gist 6193852 spectrogramModel.js %}

This indeed results in clearer peaks in the spectrogram but these peaks are still not good enough to overcome the valley of the low-resoluted spectrogram which limits the working of the HPS algoritm. Currently the algorithm can still yield somewhat satisfying results if all the parameters involved (HPS-iterations, audio filter coefficients, variance threshold etc.) goes through some fine tuning. But it is not by far good enough to accurately tone detect live input and especially not with disyllabic words like 瑞典 (Ruìdiǎn - Sweden).

Going into gamplay mode
-----------------------

Toney now has a starpowered scoring system in which the player gets stars according to how well she or he matches the reference toneline. Since the algorithm is admittedly lacking in accuracy I have created a rather kind scoring algorithm. It currently only takes into account the overall slope and length of the toneline and doesn't weigh in the characteristics of the different segments that the line may consist of. I now enjoy the privelege of becoming frustrated of a game that I myself have created. Anyways, this is the code snippet to be mad at when Toney doesn't get it:

{% gist 6193852 gameModel.js %}

If you have getUserMedia enabled in Chrome, Firefox nightly just recently shipped with this feature but only in an experimental version and I don't think Toney is working there atm, you can try the demo on this very [site](http://biggestt.github.io/toney/demo.html). Now go get some 非常好 tonelines!



