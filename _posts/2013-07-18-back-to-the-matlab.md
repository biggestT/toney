---
layout: post
title: "Back to the Matlab"
description: ""
category: algorithm
tags: [algorithm, matlab]
---
{% include JB/setup %}

I have decided to go back to Matlab in order to fine-tune the algorithm more thoroughly. I will now be evaluating the algorithm in a more general sense as well as adjusting the different parameters which until now has been set in a rather arbitrary way. But I do not want to rely on Matlabs built in FFT functions since they will not be accessible for the web application. Instead I work with the actual spectrogram that the Web Audio API outputs. I have also started using GitHub's nice issuetracker instead of Trello. My ups and downs in Matlab can be followed in the [issue #11 branch](https://github.com/biggestT/toney/tree/iss11/) during these coming days. To boost the morale I also include the sexy velvet spectrogram that I am working with!

![Heatmap of tone specrogram]({{ BASE_PATH }}/assets/images/heatmap.png)
The four tones as portrayed by the Web Audio API spectrogram. Each of them has their very own characteristics and I can't choose which one of them I like the most.