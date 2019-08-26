FROM infracamp/kickstart-flavor-datalytics:testing

ENV IMAGE_NAME "${IMAGE_NAME}"
ENV ADMIN_PASS ""

ADD /flavor /kickstart/flavor
ADD / /datalytics
RUN ["/kickstart/flavor/flavor-build.sh"]
