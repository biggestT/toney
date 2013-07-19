% Generates toneline according to the algorithm found in js/toneModel.js
% but with matrix operations instead of realtime loops

function [tonelines spectrum] = toney(sGram, threshold)
%     close all;
    iterations = 8;
    fmin = 300;
    fmax = 3400;
    n = size(sGram,1);
    m = floor(n/iterations)
%     threshold = 1000;
    
    spectrum = ones(n, m);
    for i = 1:m
        spectrum(i,:) = spectrum(i,:) + i * 30;
    end
    
    % Simulate javascript loop over n samples
    for s = 1:n
        % Calculate variance to detect speech sample
        normalSum = sum(sGram(s,:));
        squaredSum = sum(sGram(s,:).*sGram(s,:));
        variance = (squaredSum-(normalSum*normalSum)/n)/n;
        % only get HPS for sample if above noise threshold
        if variance > threshold
            for i = 1:iterations
                for j = 1:m
                    spectrum(s,j) = spectrum(s,j) * sGram(s,j*i) / 50;
                end
            end
        else
            spectrum(s,:) = 0;
        end
    end
    
    [maxvalues, peaks] = max(spectrum,[],2);
    % convert from index to Hertz
    tonelines = peaks./m.*(fmax - fmin) + fmin;
    
    figure;
    plot(1:n,tonelines, '--.');
    axis([0 n fmin 1500]);
%     HeatMap(sGram');
   
 
    