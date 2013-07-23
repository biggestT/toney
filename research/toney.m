% Generates toneline according to the algorithm found in js/toneModel.js
% but with matrix operations instead of realtime loops

function [tonelines spectrum] = toney(sGram, threshold)
%     close all;
    iterations = 8;
    n = size(sGram,1);
    N = size(sGram,2);
    m = floor(N/iterations)
    
    spectrum = ones(n, m);
    for i = 1:m
        spectrum(i,:) = spectrum(i,:) + i;
    end
    
    % Simulate javascript loop over n samples
    for s = 1:n
        % Calculate variance to detect speech sample
        normalSum = sum(sGram(s,:));
        squaredSum = sum(sGram(s,:).*sGram(s,:));
        variance = (squaredSum-(normalSum*normalSum)/n)/n;
        % only get HPS for sample if above noise threshold
        % if variance >= threshold
            for i = 1:iterations
                for j = 1:m
                    spectrum(s,j) = spectrum(s,j) * sGram(s,j*i);
                end
            end
        % else
        %     spectrum(s,:) = 0;
        % end
    end
    
    [maxvalues, tonelines] = max(spectrum,[],2);
    
    figure;
    plot(1:n,tonelines, '--.r');
    axis([0 n 0 m/4]);
    HeatMap(sGram');
   
 
    