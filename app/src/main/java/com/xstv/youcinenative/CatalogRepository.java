package com.xstv.youcinenative;

import android.content.Context;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class CatalogRepository {
    public static List<MediaItemModel> load(Context context) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(context.getAssets().open("catalog.json"), StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(); String line;
        while((line=br.readLine())!=null) sb.append(line);
        br.close();
        JSONArray groups = new JSONArray(sb.toString());
        List<MediaItemModel> out = new ArrayList<>();
        for(int i=0;i<groups.length();i++){
            JSONObject g=groups.getJSONObject(i); String cat=g.optString("name"); String gt=g.optString("type");
            JSONArray items=g.optJSONArray("items"); if(items==null) continue;
            for(int j=0;j<items.length();j++){
                JSONObject o=items.getJSONObject(j);
                out.add(new MediaItemModel(o.optString("name"),o.optString("url"),o.optString("logo"),o.optString("type",gt),o.optString("cat",cat)));
            }
        }
        return out;
    }
    public static List<String> categories(List<MediaItemModel> all, String type){
        Set<String> set=new LinkedHashSet<>();
        for(MediaItemModel m:all) if(type==null || type.equals("all") || type.equals(m.type)) set.add(m.cat);
        return new ArrayList<>(set);
    }
}
