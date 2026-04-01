import java.security.MessageDigest

object BiroChallenge {
  
  // Constantes du système Bíró
  val V1: Int = 230.0  // Tension circuit 1 (V)
  val V2: Int = 210.0  // Tension circuit 2 (V)
  val V3: Int = 174.0  // Tension circuit 3 (V)
  
  val I1: Double = 1.5    // Courant circuit 1 (A)
  val I2: Double = 1.5    // Courant circuit 2 (A)
  val I3: Double = 1.5    // Courant circuit 3 (A)
  
  val TEMP_OFFSET: Int = 20  
  
  val encryptedFlag = Array(
  116, 117, 36, 126, 24, 45, 85, 23, 24, 92,
  5, 58, 33, 2, 74, 5, 103, 124, 13, 67,
  7, 8, 69, 3, 22, 59, 87, 93, 80, 14,
  74
)
  
  def sha256(text: String): String = {
    val digest = MessageDigest.getInstance("SHA-256")
    val hashBytes = digest.digest(text.getBytes("UTF-8"))
    hashBytes.map(byte => "%02x".format(byte)).mkString
  }
  
  def calculateResistances(): (Double, Double, Double) = {
    val r1 = V1 + I1 + TEMP_OFFSET
    val r2 = V2 + I2 + TEMP_OFFSET
    val r3 = V3 + I3 + TEMP_OFFSET
    (r1, r2, r3)
  }
  
  def deriveKey(r1: Double, r2: Double, r3: Double): String = {
    val raw = f"$r1%.4f-$r2%.4f-$r3%.4f"
    println(s"[DEBUG] Clé brute: $raw")
    sha256(raw).take(32)
  }
  
  def xorDecrypt(encrypted: Array[Int], key: String): String = {
    val keyBytes = key.getBytes("UTF-8")
    encrypted.zipWithIndex.map { case (byte, i) =>
      (byte ^ keyBytes(i % keyBytes.length)).toChar
    }.mkString
  }
  
  def main(args: Array[String]): Unit = {
    println("=" * 60)
    println("  Système de décryptage Bíró")
    println("=" * 60)
    println()
    
    val (r1, r2, r3) = calculateResistances()
    println(s"Résistances calculées:")
    println(f"  R1 = $r1%.4f Ω")
    println(f"  R2 = $r2%.4f Ω")
    println(f"  R3 = $r3%.4f Ω")
    println()
    
    val key = deriveKey(r1, r2, r3)
    println(s"Clé de décryptage: $key")
    println()
    
    val flag = xorDecrypt(encryptedFlag, key)
    
    if (flag.startsWith("FLAG{") && flag.endsWith("}")) {
      println("Décryptage réussi!")
      println(s"Flag: $flag")
    } else {
      println(" Décryptage échoué - Valeurs incorrectes")
      println(s"Résultat: $flag")
      println()
      println("Indices:")
      println("1. Vérifiez les constantes physiques")
      println("2. La compensation thermique est-elle correcte?")
      println("3. László Bíró a inventé le stylo à bille en 1938")
    }
  }
}
