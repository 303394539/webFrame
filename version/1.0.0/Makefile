deploy:
	@spm build
	@grunt build:proc
	@cp -R ./build/dist/ ./build
	@rm -rf ./build/dist
	@rm -rf ./dist
	# @rsync -delete build/ ../deploy