package musicclient.filters;

import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;
import music.settings.PrivateSettings;
import org.springframework.beans.factory.annotation.Autowired;

public class BasicAuthorizationHeaderFilter extends ZuulFilter {

    @Autowired
    private PrivateSettings privateSettings;

    @Override
    public String filterType() {
        return "pre";
    }

    @Override
    public int filterOrder() {
        return 10;
    }

    @Override
    public boolean shouldFilter() {
        return true;
    }

    @Override
    public Object run() {
        RequestContext ctx = RequestContext.getCurrentContext();
//        HttpServletRequest request = ctx.getRequest();
        ctx.getRequest().getRequestURL();
//        ctx.addZuulRequestHeader("Authorization", request.getHeader("Authorization"));
        ctx.addZuulRequestHeader("Authorization", privateSettings.getZuulMusicAuthorizationHeader());
        return null;
    }
}