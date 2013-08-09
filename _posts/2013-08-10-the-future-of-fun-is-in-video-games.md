---
layout: post
title: "The future of fun is in video games"
tagline: "Practice Chinese with a Youtube tutor and a Toney tone-line?"
category: 
tags: [future, forecasting, experiment]
---
{% include JB/setup %}

![tone-line on Youtube video]({{ BASE_PATH }}/assets/images/videoapp.png)


The speaking-mandarin-alone syndrome
----------------------------------

When studying Mandarin Chinese online I usually find myself sitting in front of my computer looking at some Youtube clip. Every now and then I also at the same time talk to the screen and feel embarrassed that my neighbours might think that I am a retard, or even worse - that my pronunciation is making them 不好意思 (Bù hǎoyìsi - feel embarrassed). 

Real time Toney tone-line assistant to the rescue ... NOT!
-------------------------------------------------
But what if there were someone listening to me? Someone who also could tell me if my tone is right? That someone will hopefully be Toney! Unfortunately Youtube [currently](http://stackoverflow.com/questions/13901696/accessing-youtube-live-streams-with-web-audio-api), unlike for example [Soundcloud](http://developers.soundcloud.com/docs/api/guide#uploading), doesn't allow me to get the HTML5 video stream of their videos and connect them to my Web Audio Graph for analysis. 

Prototype experiment go!
--------------------------
To get a feel for what this could be like I still put together a [test]({{ BASE_PATH }}{{ site.JB.videoapp_path }}) where you just have to listen to with headphones on so that the tutor's voice doesn't interfer with your own. You can pause and play the video by simply clicking on it. The advantage of having the Youtube audio stream would be that the tutor's tone-line would be plotted in a separate color and with enhanced pitch-detection. This experiment requires Google Chrome with getUserMedia enabled. 