package com.xstv.youcinenative;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class MediaAdapter extends RecyclerView.Adapter<MediaAdapter.VH>{
    public interface Listener { void open(MediaItemModel item); void favorite(MediaItemModel item); }
    private final Listener listener; private final Set<String> favorites; private List<MediaItemModel> data=new ArrayList<>();
    public MediaAdapter(Listener l, Set<String> favorites){this.listener=l;this.favorites=favorites;}
    public void submit(List<MediaItemModel> list){data=new ArrayList<>(list);notifyDataSetChanged();}
    @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p,int v){return new VH(LayoutInflater.from(p.getContext()).inflate(com.xstv.youcinenative.R.layout.item_media,p,false));}
    @Override public void onBindViewHolder(@NonNull VH h,int pos){
        MediaItemModel m=data.get(pos); h.title.setText(m.name); h.fav.setText(favorites.contains(m.url)?"♥":"♡");
        Glide.with(h.poster.getContext()).load(m.logo).centerCrop().placeholder(android.R.drawable.ic_menu_report_image).into(h.poster);
        h.itemView.setOnClickListener(v->listener.open(m)); h.fav.setOnClickListener(v->listener.favorite(m));
    }
    @Override public int getItemCount(){return data.size();}
    static class VH extends RecyclerView.ViewHolder{ImageView poster;TextView title,fav;VH(View v){super(v);poster=v.findViewById(R.id.poster);title=v.findViewById(R.id.title);fav=v.findViewById(R.id.fav);}}
}
