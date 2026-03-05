#![deny(clippy::all)]

use napi_derive::napi;
use napi::Result;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[napi(object)]
pub struct KMeansResult {
  pub clusters: Vec<Vec<f64>>,
  pub labels: Vec<i32>,
}

#[napi]
pub fn perform_kmeans(data: Vec<f64>, k: i32, max_iterations: i32) -> Result<KMeansResult> {
  let n = data.len();
  if n == 0 || k <= 0 {
      return Ok(KMeansResult {
          clusters: vec![],
          labels: vec![],
      });
  }

  let k_usize = k as usize;
  
  // Initialization: Pick initial centroids distributed evenly across the data
  let mut centroids = vec![0.0; k_usize];
  let step = if n > k_usize { n / k_usize } else { 1 };
  for i in 0..k_usize {
      centroids[i] = data[(i * step) % n];
  }

  let mut labels = vec![0; n];

  for _iteration in 0..max_iterations {
      let mut changed = false;
      let mut new_centroids = vec![0.0; k_usize];
      let mut counts = vec![0; k_usize];

      // Assign each point to the nearest centroid
      for (i, &val) in data.iter().enumerate() {
          let mut min_dist = f64::MAX;
          let mut best_cluster = 0;

          for (c, &centroid) in centroids.iter().enumerate() {
              let dist = (val - centroid).abs();
              if dist < min_dist {
                  min_dist = dist;
                  best_cluster = c;
              }
          }

          if labels[i] != best_cluster as i32 {
              labels[i] = best_cluster as i32;
              changed = true;
          }

          new_centroids[best_cluster] += val;
          counts[best_cluster] += 1;
      }

      // If no points changed clusters, we have converged
      if !changed {
          break;
      }

      // Recompute centroids as the mean of assigned points
      for c in 0..k_usize {
          if counts[c] > 0 {
              centroids[c] = new_centroids[c] / counts[c] as f64;
          }
      }
  }

  // Wrap clusters into Vec<Vec<f64>> to maintain API compatibility for N-D future upgrades
  let clusters_2d = centroids.into_iter().map(|c| vec![c]).collect();

  Ok(KMeansResult {
      clusters: clusters_2d,
      labels,
  })
}
