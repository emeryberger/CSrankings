# From https://www.commandlinefu.com/commands/view/9836/remove-bom-byte-order-mark-from-text-file
awk '{if(NR==1)sub(/^\xef\xbb\xbf/,"");print}'
