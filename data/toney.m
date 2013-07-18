% Generates toneline according to the algorithm found in js/toneModel.js
% but with matrix operations instead of realtime loops

%function [tonelines] = toney(sgram)
    close all;
    sgram = spec;
    iterations = 7;
    fmin = 300;
    fmax = 3400;
    n = size(sgram,1);
    m = floor(n/iterations);
    
    spectrum = ones(n, m);
    for i = 1:m
        spectrum(i,:) = spectrum(i,:) + i * 30;
    end
    
    for s = 1:n
        for i = 1:iterations
            for j = 1:m
                spectrum(s,j) = spectrum(s,j) * sgram(s,j*i) / 50;
            end
        end
    end
    
    [maxvalues, peaks] = max(spectrum,[],2);
    % convert from index to Hertz
    peaks = peaks./m.*(fmax - fmin) + fmin;
    
    figure;
    plot(1:n,peaks);
    axis([0 n fmin fmax]);
    HeatMap(sgram');
   
 
    