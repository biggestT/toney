---
layout: post
title: "Simple Linear Regression"
description: "Regression analysis to get the straight line"
category: algorithm
tags: [algorithm, LMS]
---
{% include JB/setup %}

[Simple linear regression](http://en.wikipedia.org/wiki/Simple_linear_regression) can be used to get a single straight line to go through a set of scattered data points. I first set up a [simple test](https://github.com/biggestT/toney/blob/research/lms.html) and then implemented the method in the actual [toneline view](https://github.com/biggestT/toney/blob/smoothMiddleLine/js/toneView.js) of Toney. Once I have set up a place to host the development branch of Toney you will be able to see this first somewhat satisfying result in action. The problem now is that having only one straight line is not enough for the third tone. The third tone needs to be separated into two different segments by the use of [segmented regression](http://en.wikipedia.org/wiki/Segmented_regression) but that method has yet to be implemented in Toney. Stay toned ;) ...

![Heatmap of tones]({{ HOME_PATH }}/assets/images/lms.png)
Screenshot from a test of simple linear regression where a set of data points is turned into an approximated straight line.

