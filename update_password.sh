#!/bin/bash

# Prompt for the password
echo -n "Please enter the new password for kristopherr@gmx.com on smtp.ionos.com: "
read -s password
echo

# Update the password in the sasl_passwd file
sudo sed -i "s/\[smtp.ionos.com\]:587 kristopherr@gmx.com:50cITQqBJjfuL1t/\[smtp.ionos.com\]:587 kristopherr@gmx.com:$password/" /etc/postfix/sasl_passwd

# Update the Postfix lookup table
sudo postmap /etc/postfix/sasl_passwd

# Restart the Postfix service
sudo systemctl restart postfix

echo "Password updated and Postfix restarted successfully."
