package com.xstv.youcinenative;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.Executors;

public class MainActivity extends AppCompatActivity implements MediaAdapter.Listener {
    private final List<MediaItemModel> all=new ArrayList<>();
    private List<MediaItemModel> filtered=new ArrayList<>();
    private MediaAdapter adapter; private EditText search; private TextView status; private LinearLayout chips;
    private String type="all", category="all", query=""; private SharedPreferences prefs;
    private Set<String> favorites;

    @Override protected void onCreate(Bundle b){super.onCreate(b);setContentView(R.layout.activity_main);
        prefs=getSharedPreferences("youcine",MODE_PRIVATE); favorites=new HashSet<>(prefs.getStringSet("favorites",new HashSet<>()));
        search=findViewById(R.id.search); status=findViewById(R.id.status); chips=findViewById(R.id.chips);
        RecyclerView rv=findViewById(R.id.recycler); rv.setLayoutManager(new GridLayoutManager(this,2)); adapter=new MediaAdapter(this,favorites); rv.setAdapter(adapter);
        search.addTextChangedListener(new android.text.TextWatcher(){public void beforeTextChanged(CharSequence s,int st,int c,int a){} public void onTextChanged(CharSequence s,int st,int b,int c){query=s.toString();apply();} public void afterTextChanged(android.text.Editable e){}});
        findViewById(R.id.navHome).setOnClickListener(v->{type="all";category="all";renderChips();apply();});
        findViewById(R.id.navMovies).setOnClickListener(v->{type="filme";category="all";renderChips();apply();});
        findViewById(R.id.navChannels).setOnClickListener(v->{type="canal";category="all";renderChips();apply();});
        findViewById(R.id.navFav).setOnClickListener(v->{type="favorites";category="all";renderChips();apply();});
        findViewById(R.id.navSettings).setOnClickListener(v->showSettings());
        load();
    }
    private void load(){status.setText("Carregando catálogo nativo..."); Executors.newSingleThreadExecutor().execute(()->{try{List<MediaItemModel> x=CatalogRepository.load(this);runOnUiThread(()->{all.clear();all.addAll(x);status.setText(String.format(Locale.getDefault(),"%d títulos carregados",all.size()));renderChips();apply();});}catch(Exception e){runOnUiThread(()->status.setText("Erro ao ler catálogo: "+e.getMessage()));}});}
    private void renderChips(){chips.removeAllViews(); if(all.isEmpty())return;
        List<String> cats=CatalogRepository.categories(all,type.equals("favorites")?"all":type);
        addChip("Tudo","all"); int limit=25; for(String c:cats){if(limit--<=0)break;addChip(c,c);}
    }
    private void addChip(String label,String value){Button b=new Button(this); b.setText(label); b.setTextSize(11); b.setTextColor(value.equals(category)?0xFF111111:0xFFE5E7EB); b.setAllCaps(false); b.setSelected(value.equals(category)); b.setBackgroundResource(R.drawable.bg_chip); LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-2,42);lp.setMargins(4,2,4,2);b.setLayoutParams(lp);b.setOnClickListener(v->{category=value;renderChips();apply();});chips.addView(b);}
    private void apply(){
        String q=query.trim().toLowerCase(Locale.ROOT); filtered=new ArrayList<>();
        for(MediaItemModel m:all){
            if(type.equals("favorites")&&!favorites.contains(m.url))continue;
            if(type.equals("filme")&&!"filme".equals(m.type))continue; if(type.equals("canal")&&!"canal".equals(m.type))continue; if(type.equals("série")&&!"série".equals(m.type))continue;
            if(!category.equals("all")&&!category.equals(m.cat))continue;
            if(!q.isEmpty()&&!m.name.toLowerCase(Locale.ROOT).contains(q))continue;
            filtered.add(m);
        }
        adapter.submit(filtered); status.setText(filtered.size()+" resultados");
    }
    @Override public void open(MediaItemModel item){Intent i=new Intent(this,PlayerActivity.class);i.putExtra("url",item.url);i.putExtra("name",item.name);i.putExtra("type",item.type);startActivity(i);}
    @Override public void favorite(MediaItemModel item){if(favorites.contains(item.url))favorites.remove(item.url);else favorites.add(item.url);prefs.edit().putStringSet("favorites",new HashSet<>(favorites)).apply();adapter.notifyDataSetChanged();if(type.equals("favorites"))apply();}
    private void showSettings(){new androidx.appcompat.app.AlertDialog.Builder(this).setTitle("Configurações").setMessage("Youcine Premium Native\n\nCatálogo extraído do index.html enviado.\nPlayer nativo: AndroidX Media3 ExoPlayer.\n\nA reprodução depende da disponibilidade e autorização da fonte de mídia. O app não desativa DRM, autenticação ou proteções do servidor.").setPositiveButton("OK",null).show();}
}
