# Algorithm

For each character represented in UnicodeData.txt, in a map, set the key as the
codepoint number and the value as the name of the character from
UnicodeData.txt.

For each character in NameAliases.txt, if the third field is "control", then,
then replace the value in the map with the alias. if multiple aliases are
present, only use the first one (because it seems to be the best representation
of the character).

For each line in Unihan_Readings.txt, if the line is a kDefinition line, then
replace the value in the map with the definition.
