#

NODEVER=v4.3.1

all:
	echo "HA1HomeBridge"
	npm ls || npm install
	node ha1homebridge

install:
	if [ "`uname -s`" != "Linux" -o \( "`uname -m`" != "armv7l" -a "`uname -m`" != "armv6l" \) ] ; then exit 1; fi
	- [ ! -f /etc/init.d/homebridge ] || /etc/init.d/homebridge stop
	- useradd -d /var/ha1/HomeBridge -c "for home control homebridge" -r -s /usr/sbin/nologin ha1homebridge
	[ -d /usr/local/node-${NODEVER}-linux-armv6l ] || curl http://nodejs.org/dist/${NODEVER}/node-${NODEVER}-linux-armv6l.tar.gz | tar zxf - -C /usr/local
	[ -d /usr/local/node-${NODEVER}-linux-armv7l ] || curl http://nodejs.org/dist/${NODEVER}/node-${NODEVER}-linux-armv7l.tar.gz | tar zxf - -C /usr/local
	rm -f /usr/local/node
	ln -s /usr/local/node-${NODEVER}-linux-`uname -m` /usr/local/node
	rm -f /var/ha1/node.ver
	echo "NODEVER=${NODEVER}" > /var/ha1/node.ver
	mkdir -p /var/ha1/HomeBridge
	cp *.js package.json client.ui /var/ha1/HomeBridge
	[ -f /var/ha1/HomeBridge/config.json ] || cp config_ha1server.json /var/ha1/HomeBridge/config.json
	chown -R ha1homebridge:ha1homebridge /var/ha1/HomeBridge
	(PATH=/usr/local/node/bin:${PATH}; npm ls -g forever || npm install -g forever)
	cp homebridge.rc /etc/init.d/homebridge
	cp homebridge.rotate /etc/logrotate.d/homebridge
	update-rc.d homebridge defaults 3 1
	su ha1homebridge -s /bin/sh -c "cd /var/ha1/HomeBridge; PATH=/usr/local/node/bin:${PATH}; npm ls || npm install"
	/etc/init.d/homebridge start

