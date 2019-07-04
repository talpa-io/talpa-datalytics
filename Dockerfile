FROM infracamp/kickstart-flavor-datalytics:testing

ENV IMAGE_NAME "${IMAGE_NAME}"

ADD /flavor /kickstart/flavor
ADD / /datalytics

RUN ["/kickstart/flavor/flavor-build.sh"]

ENTRYPOINT ["/kickstart/flavorkit/scripts/start.sh", "standalone"]
