package com.xstv.youcinenative;

import android.net.Uri; import android.os.Bundle; import android.view.View; import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.media3.common.MediaItem; import androidx.media3.common.MimeTypes; import androidx.media3.exoplayer.ExoPlayer; import androidx.media3.ui.PlayerView;

public class PlayerActivity extends AppCompatActivity{
    private ExoPlayer player;
    @Override protected void onCreate(Bundle b){super.onCreate(b);setContentView(R.layout.activity_player);
        String url=getIntent().getStringExtra("url"); String name=getIntent().getStringExtra("name"); ((TextView)findViewById(R.id.playerTitle)).setText(name==null?"Reproduzindo":name);
        PlayerView pv=findViewById(R.id.playerView); player=new ExoPlayer.Builder(this).build(); pv.setPlayer(player);
        MediaItem.Builder mb=new MediaItem.Builder().setUri(Uri.parse(url));
        String clean=url==null?"":url.split("\\?")[0].toLowerCase(); if(clean.endsWith(".m3u8"))mb.setMimeType(MimeTypes.APPLICATION_M3U8);
        player.setMediaItem(mb.build()); player.prepare(); player.play();
    }
    @Override protected void onStop(){super.onStop();if(player!=null)player.pause();}
    @Override protected void onDestroy(){if(player!=null){player.release();player=null;}super.onDestroy();}
}
