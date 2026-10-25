# W15 페이지네이션 개념 보강 계획

원문283줄을전문검토했다. 연구폴더의옛W15사본은현재원문과다르므로현재repo원문을기준으로한다. Mermaid1/SQL1(3query)/Java2/JSON1의5fence와SHA를보존했다. 현재실행·이미지·UI는준비중이며완료로표시하지않는다.

1. 원문SQL·Java2·JSONplaceholder와baseline고정 → 원문본문/코드/id/기존지도보존을검사한다.
2. W15가정Article용별도추가schema/entity를구현 → R03/R04의ds_practice.article에는status가없고published_at이nullable이므로재사용하지않는다. 기존practice/학습자DB도사용하지않는다.
3. 새privateMySQL8.4.11datadir/socket/자체PID/새loopbackTLSSELECT-only계정guard뒤별도toydata적재 → 600PUBLISHED+37DRAFT,첫70시간동률/첫50마지막id700000·12:00으로설정해원문literal경계를관찰한다.
4. 원문SQL3개실행과추가동일페이지경계대조 → OFFSET450과고정cursorliteral이같은페이지라고가정하지않는다. 추가로OFFSET450의이전행경계를구해seek50과동일결과를확인한다. EXPLAINANALYZE는실행하고rawtime은별도원자료에보관하며frozen수치/성능비율로만들지않는다. 실제iterator행·loop·선택index와JDBC결과행을구분한다.
5. 원문Repository/PagingExample2Java를그대로별도JDK21/SpringDataJPA/BOM4.1.1fixture로실행 → 추가Article@Entity/schema/context/관찰wrapper와원문을구분한다. 실제의존성버전·Page조건부count/Slice와Windowpeek/offsetinitial배타경계/키셋SQL을기록한다. consume본문은원문에서비어있어DTO/HTTP전달을했다고표시하지않는다.
6. 추가동률/혼합정렬/NULL/뒤늦은삽입/정렬키변경/삽입삭제와offset이동/별도snapshot·ROW범위 → 통제된두연결과부하시험을구분한다. Base64/HMAC는추가fixture로검토하되원문JSON은실제API/서명토큰이아닌placeholder로남긴다.
7. Luna/OpenAI공식근거·메인실제결과대조 → 실제imagegen/좁은UI위임/원문보존/브라우저두크기/필수감사/독립리뷰. verified상태는근거없이올리지않는다.
