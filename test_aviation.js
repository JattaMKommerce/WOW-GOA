async function testAviationStack() {
  try {
    const res = await fetch("http://api.aviationstack.com/v1/flights?access_key=a916f37e1b947901bf638940d56f8951&dep_iata=DEL&arr_iata=GOI");
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch(e) {
    console.error(e);
  }
}
testAviationStack();
