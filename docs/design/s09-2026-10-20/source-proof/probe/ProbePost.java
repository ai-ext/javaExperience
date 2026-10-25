package example;

import jakarta.persistence.*;

/** 원문에는 없는 추가 probe entity. 기존 Post42 설명 그림과 실제 원문 PurchaseOrder를 구분한다. */
@Entity @Table(name="probe_post")
public class ProbePost {
    @Id private Long id;
    private String title;
    @Version private long version;
    protected ProbePost() {}
    public ProbePost(Long id,String title){this.id=id;this.title=title;}
    public Long getId(){return id;}
    public String getTitle(){return title;}
    public long getVersion(){return version;}
    public void setTitle(String title){this.title=title;}
}
