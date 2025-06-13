.PHONY: www
www:
	make -C www

.PHONY: dev
dev:
	make -C www dev
	
.PHONY: clean
clean:
	make -C www clean