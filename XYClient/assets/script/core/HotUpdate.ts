const {ccclass, property} = cc._decorator;

@ccclass
export default class HotUpdate extends cc.Component {
    @property(cc.Label)
    label: cc.Label = null;
    @property(cc.ProgressBar)
    byteProgress: cc.ProgressBar = null;
    @property(cc.Label)
    byteLabel: cc.Label = null;
    @property(cc.ProgressBar)
    fileProgress: cc.ProgressBar = null;
    @property(cc.Label)
    fileLabel: cc.Label = null;
    @property(cc.Asset)
    manifestUrl: cc.Asset = null;
    @property
    gameStartScene: string = "";

    _updating: boolean = false;
    _canRetry: boolean = false;
    _storagePath: string = "";

    _am: any;
    versionCompareHandle: any;
    _updateListener: Function;
    _checkListener: Function;
    _failCount: number = 0;

    onLoad() {
        if (!cc.sys.isNative) return;
        this._storagePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'blackjack-remote-asset';

        this.versionCompareHandle = (versionA, versionB) => {
            let vA = versionA.split('.');
            let vB = versionB.split('.');
            for (let i = 0; i < vA.length; ++i) {
                let a = parseInt(vA[i]);
                let b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                }
                else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            }
            else {
                return 0;
            }
        };

        this._am = new jsb.AssetsManager('', this._storagePath, this.versionCompareHandle);
        
        this._am.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            let compressed = asset.compressed;
            // Retrieve the correct md5 value.
            let expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            let relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            let size = asset.size;
            if (compressed) {
                this.label.string = "Verification passed : " + relativePath;
            }
            else {
                this.label.string = "Verification passed : " + relativePath + ' (' + expectedMD5 + ')';
            }
            return true;
        }.bind(this));

        this.label.string = "热更新准备就绪";

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            (this._am as any).setMaxConcurrentTask(2);
        }

        this.fileProgress.progress = 0;
        this.byteProgress.progress = 0;

        this.checkUpdate();
    }

    onDestroy() {
        if (this._updateListener) {
            this._am.setEventCallback(null);
            this._updateListener = null;
        }
    }

    checkUpdate() {
        if (this._updating) {
            this.label.string = '检查更新中...';
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            // Resolve md5 url
            let url = this.manifestUrl.nativeUrl;
            if (cc.loader.md5Pipe) {
                url = cc.loader.md5Pipe.transformURL(url);
            }
            this._am.loadLocalManifest(url);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            this.label.string = '本地manifest加载失败...';
            return;
        }
        this._am.setEventCallback(this.checkCb.bind(this));

        this._am.checkUpdate();
        this._updating = true;
    }

    checkCb(event) {
        let hasNewVersion = false;
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.label.string = "本地文件丢失";
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.label.string = "下载远程mainfest文件错误";
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.label.string = "已经是最新版本";
                this.scheduleOnce(() => {
                    cc.director.loadScene(this.gameStartScene);
                }, 1);
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                this.label.string = '发现新版本 (' + this._am.getTotalBytes() + ')';
                this.byteProgress.progress = 0;
                this.fileProgress.progress = 0;
                hasNewVersion = true;
                break;
            default:
                return;
        }
        
        this._am.setEventCallback(null);
        this._checkListener = null;
        this._updating = false;

        if (hasNewVersion) {
            this.hotUpdate();
        }
    }

    hotUpdate() {
        if (this._am && !this._updating) {
            this._am.setEventCallback(this.updateCb.bind(this));

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                // Resolve md5 url
                let url = this.manifestUrl.nativeUrl;
                if (cc.loader.md5Pipe) {
                    url = cc.loader.md5Pipe.transformURL(url);
                }
                this._am.loadLocalManifest(url);
            }

            this._failCount = 0;
            this._am.update();
            this._updating = true;
        }
    }

    updateCb(event) {
        let needRestart = false;
        let failed = false;
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.label.string = '本地版本文件丢失，无法更新';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                this.byteProgress.progress = event.getPercent();
                this.fileProgress.progress = event.getPercentByFile();
                this.byteLabel.string = event.getDownloadedBytes() + ' / ' + event.getTotalBytes();
                this.fileLabel.string = event.getDownloadedFiles() + ' / ' + event.getTotalFiles();
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.label.string = '下载远程版本文件失败';
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.label.string = '当前为最新版本';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                this.label.string = '更新完成. ' + event.getMessage();
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this.label.string = '更新失败. ' + event.getMessage();
                this._updating = false;
                this._canRetry = true;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                this.label.string = '资源更新错误: ' + event.getAssetId() + ', ' + event.getMessage();
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                this.label.string = event.getMessage();
                break;
            default:
                break;
        }

        if (failed) {
            this._am.setEventCallback(null);
            this._updateListener = null;
            this._updating = false;
        }

        if (needRestart) {
            this._am.setEventCallback(null);
            this._updateListener = null;
            // Prepend the manifest's search path
            let searchPaths = jsb.fileUtils.getSearchPaths();
            let newPaths = this._am.getLocalManifest().getSearchPaths();
            console.log(JSON.stringify(newPaths));
            for (let i = 0; i < newPaths.length; i++) {
                if (searchPaths.indexOf(newPaths[i]) == -1) {
                    Array.prototype.unshift.apply(searchPaths, [newPaths[i]]);
                }
            }
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            cc.audioEngine.stopAll();
            cc.game.restart();
        }
    }
    
    retry() {
        if (!this._updating && this._canRetry) {
            this._canRetry = false;
            this.label.string = '重现获取失败资源...';
            this._am.downloadFailedAssets();
        }
    }
}
