package com.sdkwork.iam.app.sdk.model;


public class WechatMiniProgramSessionCreateCommand {
    private String jsCode;
    private String providerCode;
    private String surfaceCode;

    public String getJsCode() {
        return this.jsCode;
    }

    public void setJsCode(String jsCode) {
        this.jsCode = jsCode;
    }

    public String getProviderCode() {
        return this.providerCode;
    }

    public void setProviderCode(String providerCode) {
        this.providerCode = providerCode;
    }

    public String getSurfaceCode() {
        return this.surfaceCode;
    }

    public void setSurfaceCode(String surfaceCode) {
        this.surfaceCode = surfaceCode;
    }
}
