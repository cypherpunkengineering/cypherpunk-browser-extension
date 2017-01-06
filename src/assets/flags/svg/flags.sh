#!/bin/bash
for i in Flag_of_*;do
	country=`echo "$i"|sed -e 's/Flag_of_//' -e 's/\.svg//' -e 's/_/ /g' -e 's/the //'`
	cc=`grep -i "$country" $HOME/Development/cypherpunk/cypherpunk-database/framework/util/world.coffee|cut -d : -f1|xargs|head -1`
	if [ ! -z "${cc}" ];then
		echo "$country is $cc"
		cp "$i" "flag-${cc}.svg"
	fi
done
