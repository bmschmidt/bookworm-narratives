awk 'BEGIN{FS=t}{if (NR==1 || (>1700 && /America|United States|Reconstruction/ )) {print}}' diss.tsv > demo.tsv
